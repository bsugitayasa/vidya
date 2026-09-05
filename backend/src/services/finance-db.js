const { AsyncLocalStorage } = require('node:async_hooks');
const { PrismaClient } = require('@prisma/client');
const client = new PrismaClient();
const context = new AsyncLocalStorage();

// Finance writes share a short transaction lock so checking the available cash,
// changing the RAB status and recording the movement cannot race each other.
const prisma = new Proxy(client, {
  get(target, key) {
    const tx = context.getStore();
    if (tx && key === '$transaction') return work => typeof work === 'function' ? work(tx) : Promise.all(work);
    const source = tx || target;
    const value = source[key];
    return typeof value === 'function' ? value.bind(source) : value;
  }
});

const atomicFinanceWrite = handler => async (req, res, next) => {
  let response;
  const rejected = Symbol('finance-response-rejected');
  const deferred = new Proxy(res, {
    get(target, key) {
      if (key === 'json') return body => { response = { status: target.statusCode, body }; return deferred; };
      if (key === 'status') return status => { target.statusCode = status; return deferred; };
      const value = target[key];
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  try {
    await client.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(704503)`;
      await context.run(tx, () => handler(req, deferred, next));
      if (response?.status >= 400) throw rejected;
    }, { timeout: 20000, maxWait: 10000 });
    if (response) res.status(response.status).json(response.body);
  } catch (error) {
    if (error === rejected) return res.status(response.status).json(response.body);
    console.error('Finance transaction failed:', error.message);
    res.status(409).json({ success: false, message: 'Transaksi belum tersimpan. Muat ulang lalu coba kembali.' });
  }
};

module.exports = { prisma, atomicFinanceWrite };

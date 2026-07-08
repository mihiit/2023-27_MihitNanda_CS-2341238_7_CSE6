const oracledb = require('oracledb');

async function check() {
  const conn = await oracledb.getConnection({
    user: 'sys',
    password: 'Mihitnanda@25',  // <-- you set this during Oracle XE install
    connectString: 'localhost:1521/XE',
    privilege: oracledb.SYSDBA
  });
  console.log('✅ Connected as SYSDBA to root (XE)');

  try {
    const r1 = await conn.execute(`SELECT sysdate FROM dual`);
    console.log('SYS can read DUAL:', JSON.stringify(r1.rows));
  } catch (e) { console.log('❌ Even SYS failed on DUAL:', e.message); }

  try {
    const r2 = await conn.execute(`SELECT COUNT(*) AS c FROM all_tables WHERE table_name = 'USERS'`);
    console.log('USERS table location count:', JSON.stringify(r2.rows));
  } catch (e) { console.log('❌ all_tables check failed:', e.message); }

  try {
    const r3 = await conn.execute(`SELECT owner, table_name FROM all_tables WHERE table_name = 'USERS'`);
    console.log('USERS owned by:', JSON.stringify(r3.rows));
  } catch (e) { console.log('❌ owner check failed:', e.message); }

  await conn.close();
}
check().catch(e => console.error('FATAL:', e.message));
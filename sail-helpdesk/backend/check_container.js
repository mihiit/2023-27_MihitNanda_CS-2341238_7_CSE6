const oracledb = require('oracledb');

async function check() {
  const conn = await oracledb.getConnection({
    user: 'sys',
    password: 'Mihitnanda@25',
    connectString: 'localhost:1521/XE',
    privilege: oracledb.SYSDBA
  });
  console.log('Connected as SYSDBA!');

  try {
    const r1 = await conn.execute(`SELECT sys_context('USERENV','CON_NAME') AS container FROM dual`);
    console.log('Current container:', JSON.stringify(r1.rows));
  } catch (e) { console.log('Container check FAILED:', e.message); }

  try {
    const r2 = await conn.execute(`SELECT name, cdb, con_id FROM v$database`);
    console.log('Database info:', JSON.stringify(r2.rows));
  } catch (e) { console.log('Database check FAILED:', e.message); }

  // Now connect specifically to XEPDB1 (the actual app PDB) instead of XE
  await conn.close();

  console.log('\n--- Trying connection to XEPDB1 directly ---');
  const conn2 = await oracledb.getConnection({
    user: 'sys',
    password: 'YOUR_SYS_PASSWORD',
    connectString: 'localhost:1521/XEPDB1',
    privilege: oracledb.SYSDBA
  });
  const r3 = await conn2.execute(`SELECT sys_context('USERENV','CON_NAME') AS container FROM dual`);
  console.log('Container via XEPDB1 connect string:', JSON.stringify(r3.rows));
  const r4 = await conn2.execute(`SELECT tablespace_name, status FROM dba_tablespaces`);
  console.log('Tablespaces via XEPDB1:', JSON.stringify(r4.rows));
  await conn2.close();
}
check().catch(e => console.error('FATAL:', e.message));
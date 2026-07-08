const oracledb = require('oracledb');

async function check() {
  // Connect as SYSDBA to check instance health
  const conn = await oracledb.getConnection({
    user: 'sys',
    password: 'Mihitnanda@25',  // <-- you set this during Oracle XE install
    connectString: 'localhost:1521/XE',
    privilege: oracledb.SYSDBA
  });
  console.log('Connected as SYSDBA!');

  try {
    const r1 = await conn.execute(`SELECT name, open_mode FROM v$pdbs`);
    console.log('PDB status:', JSON.stringify(r1.rows));
  } catch (e) { console.log('PDB check FAILED:', e.message); }

  try {
    const r2 = await conn.execute(`SELECT tablespace_name, status FROM dba_tablespaces`);
    console.log('Tablespaces:', JSON.stringify(r2.rows));
  } catch (e) { console.log('Tablespace check FAILED:', e.message); }

  try {
    const r3 = await conn.execute(`SELECT status FROM v$instance`);
    console.log('Instance status:', JSON.stringify(r3.rows));
  } catch (e) { console.log('Instance check FAILED:', e.message); }

  await conn.close();
}
check().catch(e => console.error('FATAL:', e.message));
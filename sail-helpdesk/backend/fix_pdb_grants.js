const oracledb = require('oracledb');

async function fix() {
  const conn = await oracledb.getConnection({
    user: 'sys',
    password: 'Mihitnanda@25',  // <-- you set this during Oracle XE install
    connectString: 'localhost:1521/XEPDB1',   // connect directly to the PDB
    privilege: oracledb.SYSDBA
  });
  console.log('✅ Connected as SYSDBA directly to XEPDB1!');

  const grants = [
    `GRANT CREATE SESSION TO C##sail_helpdesk`,
    `GRANT CONNECT, RESOURCE TO C##sail_helpdesk`,
    `GRANT CREATE TABLE TO C##sail_helpdesk`,
    `GRANT CREATE SEQUENCE TO C##sail_helpdesk`,
    `GRANT CREATE TRIGGER TO C##sail_helpdesk`,
    `GRANT CREATE VIEW TO C##sail_helpdesk`,
    `GRANT UNLIMITED TABLESPACE TO C##sail_helpdesk`,
  ];

  for (const sql of grants) {
    try {
      await conn.execute(sql, [], { autoCommit: true });
      console.log('✅', sql);
    } catch (e) {
      console.log('⚠️ ', sql, '->', e.message.split('\n')[0]);
    }
  }

  await conn.close();
  console.log('\nDone granting privileges in XEPDB1.');
}
fix().catch(e => console.error('FATAL:', e.message));
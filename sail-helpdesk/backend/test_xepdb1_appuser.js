const oracledb = require('oracledb');

async function check() {
  try {
    const conn = await oracledb.getConnection({
      user: 'C##sail_helpdesk',
      password: 'SailHelp2024',
      connectString: 'localhost:1521/XEPDB1'
    });
    console.log('✅ Connected to XEPDB1 as app user!');

    const r1 = await conn.execute(`SELECT sys_context('USERENV','CON_NAME') AS container FROM dual`);
    console.log('Container:', JSON.stringify(r1.rows));

    const r2 = await conn.execute(`SELECT COUNT(*) AS c FROM USERS`);
    console.log('USERS count:', JSON.stringify(r2.rows));

    const r3 = await conn.execute(`SELECT COUNT(*) AS c FROM CATEGORIES`);
    console.log('CATEGORIES count:', JSON.stringify(r3.rows));

    await conn.close();
  } catch (e) {
    console.log('❌ Connection to XEPDB1 FAILED:', e.message);
  }
}
check().catch(e => console.error('FATAL:', e.message));
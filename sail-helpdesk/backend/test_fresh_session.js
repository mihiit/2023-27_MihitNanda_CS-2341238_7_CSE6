const oracledb = require('oracledb');

async function check() {
  // Force a completely fresh, standalone connection (not pooled)
  const conn = await oracledb.getConnection({
    user: 'C##sail_helpdesk',
    password: 'SailHelp2024',
    connectString: 'localhost:1521/XE'
  });
  console.log('Fresh connection established!');

  try {
    const r = await conn.execute(`SELECT * FROM user_objects WHERE ROWNUM <= 5`);
    console.log('user_objects sample:', JSON.stringify(r.rows));
  } catch (e) { console.log('user_objects FAILED:', e.message); }

  try {
    const r2 = await conn.execute(`SELECT sysdate FROM dual`);
    console.log('SELECT FROM DUAL:', JSON.stringify(r2.rows));
  } catch (e) { console.log('DUAL FAILED:', e.message); }

  try {
    const r3 = await conn.execute(`SELECT * FROM all_objects WHERE owner = 'C##SAIL_HELPDESK' AND object_type = 'TRIGGER'`);
    console.log('all_objects triggers:', JSON.stringify(r3.rows));
  } catch (e) { console.log('all_objects FAILED:', e.message); }

  await conn.close();
}
check().catch(e => console.error('FATAL:', e.message));
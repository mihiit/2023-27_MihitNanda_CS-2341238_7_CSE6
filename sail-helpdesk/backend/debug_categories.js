const oracledb = require('oracledb');

async function debug() {
  const conn = await oracledb.getConnection({
    user: 'C##sail_helpdesk',
    password: 'SailHelp2024',
    connectString: 'localhost:1521/XE'
  });
  console.log('Connected!');

  try {
    await conn.execute(
      `INSERT INTO CATEGORIES (cat_name, cat_code, description, response_hrs, resolve_hrs, is_active)
       VALUES (:1, :2, :3, :4, :5, 1)`,
      ['Hardware', 'HARDWARE', 'Desktop, laptop, printer, peripherals', 4, 24],
      { autoCommit: true }
    );
    console.log('✅ Insert succeeded');
  } catch (e) {
    console.log('❌ FULL ERROR:');
    console.log(e.message);
    console.log('errorNum:', e.errorNum);
    console.log('offset:', e.offset);
  }

  await conn.close();
}
debug().catch(e => console.error('FATAL:', e.message));
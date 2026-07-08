const oracledb = require('oracledb');

async function check() {
  const conn = await oracledb.getConnection({
    user: 'C##sail_helpdesk',
    password: 'SailHelp2024',
    connectString: 'localhost:1521/XE'
  });
  console.log('Connected!');

  const r = await conn.execute(
    `SELECT trigger_name, table_name, status, trigger_type, triggering_event
     FROM user_triggers WHERE table_name = 'CATEGORIES'`
  );
  console.log('Triggers on CATEGORIES:', JSON.stringify(r.rows, null, 2));

  // Get the actual trigger body to see what table it references
  for (const row of r.rows) {
    const triggerName = row[0];
    try {
      const body = await conn.execute(
        `SELECT text FROM user_source WHERE name = :1 ORDER BY line`,
        [triggerName]
      );
      console.log(`\n--- Trigger body: ${triggerName} ---`);
      console.log(body.rows.map(x => x[0]).join(''));
    } catch (e) { console.log('Could not read trigger body:', e.message); }
  }

  await conn.close();
}
check().catch(e => console.error('FATAL:', e.message));
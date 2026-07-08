const oracledb = require('oracledb');

async function check() {
  const conn = await oracledb.getConnection({
    user: 'C##sail_helpdesk',
    password: 'SailHelp2024',
    connectString: 'localhost:1521/XE'
  });
  console.log('Connected!\n');

  // Test 1: simple count on CATEGORIES (we know this worked before)
  try {
    const r1 = await conn.execute(`SELECT COUNT(*) AS c FROM CATEGORIES`);
    console.log('Test 1 (COUNT CATEGORIES):', JSON.stringify(r1.rows));
  } catch (e) { console.log('Test 1 FAILED:', e.message.split('\n')[0]); }

  // Test 2: simple insert into a totally different/no-trigger context (USERS works, we know)
  try {
    const r2 = await conn.execute(`SELECT COUNT(*) AS c FROM USERS`);
    console.log('Test 2 (COUNT USERS):', JSON.stringify(r2.rows));
  } catch (e) { console.log('Test 2 FAILED:', e.message.split('\n')[0]); }

  // Test 3: try inserting with explicit cat_id to bypass any ID-generating trigger
  try {
    await conn.execute(
      `INSERT INTO CATEGORIES (cat_id, cat_name, cat_code, description, response_hrs, resolve_hrs, is_active)
       VALUES (901, 'Hardware Test', 'HWTEST', 'test', 4, 24, 1)`,
      [],
      { autoCommit: true }
    );
    console.log('Test 3 (explicit cat_id insert): SUCCESS');
  } catch (e) { console.log('Test 3 FAILED:', e.message.split('\n')[0]); }

  // Test 4: query user_objects to see what trigger/sequence names exist
  try {
    const r4 = await conn.execute(`SELECT object_name, object_type, status FROM user_objects WHERE object_type IN ('TRIGGER','SEQUENCE')`);
    console.log('Test 4 (triggers/sequences):', JSON.stringify(r4.rows));
  } catch (e) { console.log('Test 4 FAILED:', e.message.split('\n')[0]); }

  await conn.close();
}
check().catch(e => console.error('FATAL:', e.message));
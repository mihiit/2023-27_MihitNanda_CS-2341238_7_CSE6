const oracledb = require('oracledb');

async function seed() {
  const conn = await oracledb.getConnection({
    user: 'C##sail_helpdesk',
    password: 'SailHelp2024',
    connectString: 'localhost:1521/XE'
  });

  console.log('Connected!');

  // ── Categories ──
  const categories = [
    ['Hardware',         'HARDWARE', 'Desktop, laptop, printer, peripherals', 4,  24],
    ['Network',          'NETWORK',  'Wi-Fi, LAN, VPN, internet connectivity', 2,  8],
    ['Software',         'SOFTWARE', 'Application errors, installs, licenses', 4,  24],
    ['Email',            'EMAIL',    'Outlook, webmail, distribution lists',   2,  12],
    ['Security',         'SECURITY', 'Access, malware, phishing, breaches',    1,  4],
    ['Printer & Scanner','PRINTER',  'Printer/scanner setup and issues',       4,  24],
    ['SAP / ERP',        'SAP',      'SAP login, modules, reports',            2,  16],
    ['Other',            'OTHER',   'Anything not covered above',              8,  48],
  ];

  for (const [name, code, desc, resp, resolve] of categories) {
    try {
      await conn.execute(
        `INSERT INTO CATEGORIES (cat_name, cat_code, description, response_hrs, resolve_hrs, is_active)
         VALUES (:1, :2, :3, :4, :5, 1)`,
        [name, code, desc, resp, resolve],
        { autoCommit: false }
      );
      console.log('✅ Category:', name);
    } catch (e) { console.log('⚠️  Category', name, 'skipped:', e.message.split('\n')[0]); }
  }

  // ── Priorities ──
  const priorities = [
    ['Critical', 'CRITICAL', '#C0392B', 1, 4,  1],
    ['High',     'HIGH',     '#D97706', 4, 8,  2],
    ['Medium',   'MEDIUM',   '#B7950B', 8, 24, 3],
    ['Low',      'LOW',      '#15803D', 24,72, 4],
  ];

  for (const [name, code, color, resp, resolve, sort] of priorities) {
    try {
      await conn.execute(
        `INSERT INTO PRIORITIES (priority_name, priority_code, color_hex, response_hrs, resolve_hrs, sort_order, is_active)
         VALUES (:1, :2, :3, :4, :5, :6, 1)`,
        [name, code, color, resp, resolve, sort],
        { autoCommit: false }
      );
      console.log('✅ Priority:', name);
    } catch (e) { console.log('⚠️  Priority', name, 'skipped:', e.message.split('\n')[0]); }
  }

  await conn.commit();
  console.log('🎉 Done! Committed all changes.');
  await conn.close();
}

seed().catch(e => console.error('❌ FATAL:', e.message));
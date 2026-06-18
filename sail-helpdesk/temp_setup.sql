-- Step 1: Create schema user
CREATE USER sail_helpdesk IDENTIFIED BY "SailHelp@2024";
GRANT CONNECT, RESOURCE, CREATE SESSION TO sail_helpdesk;
GRANT UNLIMITED TABLESPACE TO sail_helpdesk;
COMMIT;
EXIT;

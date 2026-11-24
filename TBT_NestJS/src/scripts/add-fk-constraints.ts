import sequelize from "../config/database";

async function addFkConstraints() {
  const queries = [
    // tickets.customer_id -> customers.id
    `ALTER TABLE tickets ADD CONSTRAINT fk_tickets_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT ON UPDATE CASCADE`,
    // team_agent.team_id -> teams.id
    `ALTER TABLE team_agent ADD CONSTRAINT fk_team_agent_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE RESTRICT ON UPDATE CASCADE`,
    // team_agent.agent_id -> agents.id
    `ALTER TABLE team_agent ADD CONSTRAINT fk_team_agent_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE RESTRICT ON UPDATE CASCADE`,
  ];

  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    for (const q of queries) {
      try {
        await sequelize.query(q);
        console.log('Executed:', q);
      } catch (err: any) {
        // If constraint already exists or other error, show and continue
        console.warn('Query failed:', q, '\n', err.message || err);
      }
    }

    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('DB connection failed', err);
    process.exit(1);
  }
}

addFkConstraints();

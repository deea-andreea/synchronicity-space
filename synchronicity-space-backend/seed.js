import { sequelize, Role, Permission } from "./src/models/index.js";

async function seed() {
  try {
    // 1. Force the creation of the bridge table
    await sequelize.sync({ alter: true }); 
    console.log("Database tables synced!");

    const [adminRole] = await Role.findOrCreate({ where: { name: 'admin' } });
    const [userRole] = await Role.findOrCreate({ where: { name: 'user' } });

    const [p1] = await Permission.findOrCreate({ where: { name: 'view_stats' } });
    const [p2] = await Permission.findOrCreate({ where: { name: 'manage_users' } });
    const [p3] = await Permission.findOrCreate({ where: { name: 'edit_library' } });
    const [p8] = await Permission.findOrCreate({ where: {name: 'navigate_listening_space'}});
    const [p4] = await Permission.findOrCreate({where: {name: 'chat_with_users'}});
    const [p5] = await Permission.findOrCreate({where: {name: 'view_library'}});
    const [p6] = await Permission.findOrCreate({where: {name: 'play_music'}});
    const [p7] = await Permission.findOrCreate({where: {name: 'leave_notes'}});

    await adminRole.addPermissions([p1, p2, p3, p4, p8,p5,p6,p7]);
    await userRole.addPermissions([p1,p5,p6,p7]);

    console.log("Seeding successful!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
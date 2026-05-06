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

    await adminRole.addPermissions([p1, p2, p3]);
    await userRole.addPermissions([p1]);

    console.log("Seeding successful!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
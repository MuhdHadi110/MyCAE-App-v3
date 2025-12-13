import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { Client } from '../entities/Client';
import { TeamMember } from '../entities/TeamMember';
import { Project, ProjectStatus } from '../entities/Project';
import bcrypt from 'bcryptjs';

async function seedData() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    const userRepo = AppDataSource.getRepository(User);
    const clientRepo = AppDataSource.getRepository(Client);
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);
    const projectRepo = AppDataSource.getRepository(Project);

    // 1. Create Users and Team Members
    console.log('\n📝 Seeding Users and Team Members...');

    const users = [
      {
        name: 'John Engineer',
        email: 'john@mycae.com',
        password_hash: await bcrypt.hash('john123', 10),
        role: UserRole.ENGINEER,
        department: 'Engineering',
        position: 'Engineer',
      },
      {
        name: 'Sarah Senior',
        email: 'sarah@mycae.com',
        password_hash: await bcrypt.hash('sarah123', 10),
        role: UserRole.SENIOR_ENGINEER,
        department: 'Engineering',
        position: 'Senior Engineer',
      },
      {
        name: 'Mike Principal',
        email: 'mike@mycae.com',
        password_hash: await bcrypt.hash('mike123', 10),
        role: UserRole.PRINCIPAL_ENGINEER,
        department: 'Engineering',
        position: 'Principal Engineer',
      },
      {
        name: 'Lisa Manager',
        email: 'lisa@mycae.com',
        password_hash: await bcrypt.hash('lisa123', 10),
        role: UserRole.MANAGER,
        department: 'Management',
        position: 'Project Manager',
      },
    ];

    const createdUsers = [];
    for (const userData of users) {
      let user = await userRepo.findOne({ where: { email: userData.email } });
      if (!user) {
        user = userRepo.create(userData);
        await userRepo.save(user);
        console.log(`  ✓ Created user: ${userData.name}`);
      }
      createdUsers.push(user);
    }

    // Create TeamMembers from Users
    for (const user of createdUsers) {
      const existing = await teamMemberRepo.findOne({ where: { user_id: user.id } });
      if (!existing) {
        const teamMember = teamMemberRepo.create({
          user_id: user.id,
          department: (user as any).department,
          job_title: (user as any).position,
        });
        await teamMemberRepo.save(teamMember);
        console.log(`  ✓ Created team member: ${user.name}`);
      }
    }

    // 2. Seed Clients
    console.log('\n📝 Seeding Clients...');

    const existingClients = await clientRepo.find();

    if (existingClients.length === 0) {
      const clientList = [
        {
          name: 'Tech Solutions Ltd',
          email: 'contact@techsolutions.com',
          phone: '+60345678901',
          address: '123 Tech Street, KL',
          city: 'Kuala Lumpur',
          state: 'Selangor',
          country: 'Malaysia',
          postalCode: '50100',
          contactPerson: 'John Lee',
          contactPersonRole: 'Procurement Manager',
        },
        {
          name: 'Manufacturing Corp',
          email: 'sales@manufcorp.com',
          phone: '+60345678902',
          address: '456 Industry Ave, Selangor',
          city: 'Shah Alam',
          state: 'Selangor',
          country: 'Malaysia',
          postalCode: '40000',
          contactPerson: 'Alice Wong',
          contactPersonRole: 'Engineering Lead',
        },
        {
          name: 'Global Enterprises',
          email: 'enquiry@globalenterprises.com',
          phone: '+60345678903',
          address: '789 Business Hub, Penang',
          city: 'Georgetown',
          state: 'Penang',
          country: 'Malaysia',
          postalCode: '10100',
          contactPerson: 'David Kumar',
          contactPersonRole: 'Operations Director',
        },
      ];

      for (const client of clientList) {
        const existing = await clientRepo.findOne({ where: { email: client.email } });
        if (!existing) {
          await clientRepo.save(client);
          console.log(`  ✓ Created client: ${client.name}`);
        }
      }
    } else {
      console.log(`  ℹ️  Clients already exist (${existingClients.length} clients)`);
    }

    // 3. Seed Projects
    console.log('\n📝 Seeding Projects...');

    const existingProjects = await projectRepo.find();

    if (existingProjects.length === 0) {
      const allTeamMembers = await teamMemberRepo.find({
        relations: ['user'],
      });
      const allClients = await clientRepo.find();

      if (allTeamMembers.length > 0 && allClients.length > 0) {
        // Use available users
        const engineerUserId = createdUsers[0]?.id;
        const projectManagerId = createdUsers[1]?.id;
        const thirdUserId = createdUsers[2]?.id;

        if (engineerUserId && projectManagerId && thirdUserId) {
          // Generate project codes with current year
          const currentYear = new Date().getFullYear().toString().slice(-2);
          const yearPrefix = `J${currentYear}`;

          // Use available clients (reuse if necessary)
          const client1 = allClients[0];
          const client2 = allClients[1] || allClients[0];  // Fallback to first if only one exists
          const client3 = allClients[2] || allClients[0];  // Fallback to first if less than 3 exist

          const projectList = [
            {
              project_code: `${yearPrefix}001`,
              title: 'Vibration Analysis Study',
              client_id: client1?.id || '',
              manager_id: projectManagerId,
              lead_engineer_id: engineerUserId,
              status: ProjectStatus.ONGOING,
              start_date: new Date('2025-01-15'),
              planned_hours: 120,
              remarks: 'Comprehensive vibration analysis for manufacturing equipment',
            },
            {
              project_code: `${yearPrefix}002`,
              title: 'CFD Optimization Project',
              client_id: client2?.id || '',
              manager_id: thirdUserId,
              lead_engineer_id: projectManagerId,
              status: ProjectStatus.PRE_LIM,
              start_date: new Date('2025-02-01'),
              planned_hours: 240,
              remarks: 'CFD analysis and optimization for aerodynamic design',
            },
            {
              project_code: `${yearPrefix}003`,
              title: 'Acoustic Testing',
              client_id: client3?.id || '',
              manager_id: projectManagerId,
              lead_engineer_id: engineerUserId,
              status: ProjectStatus.COMPLETED,
              start_date: new Date('2024-11-01'),
              planned_hours: 80,
              remarks: 'Full acoustic characterization and noise reduction study',
            },
          ];

          // Add 2025 historical projects
          const projectList2025 = [
            {
              project_code: 'J25001',
              title: 'Structural Analysis - Building A',
              client_id: client1?.id || '',
              manager_id: projectManagerId,
              lead_engineer_id: engineerUserId,
              status: ProjectStatus.COMPLETED,
              start_date: new Date('2025-03-01'),
              planned_hours: 150,
              remarks: 'Completed structural analysis for Building A construction project',
            },
            {
              project_code: 'J25002',
              title: 'Thermal Analysis Study',
              client_id: client2?.id || '',
              manager_id: thirdUserId,
              lead_engineer_id: projectManagerId,
              status: ProjectStatus.COMPLETED,
              start_date: new Date('2025-04-15'),
              planned_hours: 200,
              remarks: 'Thermal performance analysis and optimization',
            },
          ];

          // Save current year projects
          for (const projectData of projectList) {
            const existing = await projectRepo.findOne({ where: { project_code: projectData.project_code } });
            if (!existing && projectData.client_id && projectData.manager_id) {
              const project = projectRepo.create(projectData);
              await projectRepo.save(project);
              console.log(`  ✓ Created project: ${projectData.title} (${projectData.project_code})`);
            }
          }

          // Save 2025 historical projects
          for (const projectData of projectList2025) {
            const existing = await projectRepo.findOne({ where: { project_code: projectData.project_code } });
            if (!existing && projectData.client_id && projectData.manager_id) {
              const project = projectRepo.create(projectData);
              await projectRepo.save(project);
              console.log(`  ✓ Created project: ${projectData.title} (${projectData.project_code})`);
            }
          }
        } else {
          console.log('  ⚠️  Cannot seed projects: Not all role types of users found');
        }
      } else {
        console.log('  ⚠️  Cannot seed projects: Team members or clients not found');
      }
    } else {
      console.log(`  ℹ️  Projects already exist (${existingProjects.length} projects)`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Data seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Test Accounts:');
    console.log('  Admin: admin@mycae.com / admin123');
    console.log('  Engineer: john@mycae.com / john123');
    console.log('  Senior Engineer: sarah@mycae.com / sarah123');
    console.log('  Principal Engineer: mike@mycae.com / mike123');
    console.log('  Manager: lisa@mycae.com / lisa123');
    console.log('\n🎯 You can now:');
    console.log('  1. Login with any of the above accounts');
    console.log('  2. View existing projects, team members, and clients');
    console.log('  3. Create new projects using the Add Project button');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();

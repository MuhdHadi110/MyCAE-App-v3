import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Client } from '../entities/Client';
import { Company } from '../entities/Company';
import { Contact } from '../entities/Contact';
import { Project } from '../entities/Project';
import { v4 as uuidv4 } from 'uuid';

async function migrateClientsToCompanies() {
  console.log('🚀 Starting client-to-companies migration...\n');

  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Get all clients
      const clientRepo = queryRunner.manager.getRepository(Client);
      const clients = await clientRepo.find();

      console.log(`📊 Found ${clients.length} active clients to migrate\n`);

      const companyMap = new Map<string, string>(); // client.name -> company.id
      const contactMap = new Map<string, string>(); // client.id -> contact.id

      // Step 2: Create companies from unique client names
      console.log('📦 Creating companies from unique client names...');
      const uniqueCompanyNames = new Set<string>();
      for (const client of clients) {
        uniqueCompanyNames.add(client.name);
      }

      for (const companyName of uniqueCompanyNames) {
        const client = clients.find((c) => c.name === companyName);
        if (!client) continue;

        const company = queryRunner.manager.create(Company, {
          id: uuidv4(),
          name: client.name,
          industry: client.industry,
          website: client.website,
          address: client.address,
        });

        await queryRunner.manager.save(company);
        companyMap.set(client.name, company.id);
        console.log(`   ✅ Created company: ${company.name}`);
      }

      console.log(`\n✅ Created ${companyMap.size} companies\n`);

      // Step 3: Create contacts for each client
      console.log('👥 Creating contacts from clients...');
      for (const client of clients) {
        const companyId = companyMap.get(client.name);
        if (!companyId) {
          console.error(`   ❌ No company found for client: ${client.name}`);
          continue;
        }

        const contact = queryRunner.manager.create(Contact, {
          id: client.id, // Keep same ID for easier project migration
          company_id: companyId,
          name: client.contactPerson || 'Primary Contact',
          email: client.email,
          phone: client.phone,
          position: undefined,
          is_primary: true,
        });

        await queryRunner.manager.save(contact);
        contactMap.set(client.id, contact.id);
        console.log(`   ✅ Created contact: ${contact.name} (${contact.email}) for ${client.name}`);
      }

      console.log(`\n✅ Created ${contactMap.size} contacts\n`);

      // Step 4: Update projects to use contact_id
      console.log('🔗 Updating projects to use contact_id...');
      const projectRepo = queryRunner.manager.getRepository(Project);
      const projects = await projectRepo.find();

      let updatedCount = 0;
      for (const project of projects) {
        if (project.client_id) {
          const contactId = contactMap.get(project.client_id);
          if (contactId) {
            project.contact_id = contactId;
            await queryRunner.manager.save(project);
            updatedCount++;
            console.log(`   ✅ Updated project "${project.title}" to use contact_id`);
          } else {
            console.warn(`   ⚠️  No contact found for project "${project.title}" (client_id: ${project.client_id})`);
          }
        }
      }

      console.log(`\n✅ Updated ${updatedCount} projects\n`);

      // Commit transaction
      await queryRunner.commitTransaction();
      console.log('✅ Migration completed successfully!\n');

      // Summary
      console.log('📊 Migration Summary:');
      console.log(`   - Companies created: ${companyMap.size}`);
      console.log(`   - Contacts created: ${contactMap.size}`);
      console.log(`   - Projects updated: ${updatedCount}`);
      console.log('\n✅ All data migrated successfully!');
      console.log('\n⚠️  Note: client_id column in projects table is kept for rollback safety.');
      console.log('   You can drop it after verifying the migration is successful.\n');

    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run migration
console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║   Client to Companies Migration Script               ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

migrateClientsToCompanies()
  .then(() => {
    console.log('\n✅ Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });

package com.examly.springapp;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import com.examly.springapp.model.User;
import com.examly.springapp.model.ClaimType;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.repository.ClaimTypeRepository;

@SpringBootApplication
public class SpringappApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpringappApplication.class, args);
	}

	@Bean
	public CommandLineRunner initUsers(UserRepository userRepository,
			org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
		return args -> {
			if (userRepository.count() == 0) {

				User admin = new User();
				admin.setName("Admin User");
				admin.setEmail("admin@example.com");
				admin.setPassword(passwordEncoder.encode("admin123"));
				admin.setRole(User.UserRole.ADMIN);

				User agent = new User();
				agent.setName("Agent User");
				agent.setEmail("agent@example.com");
				agent.setPassword(passwordEncoder.encode("agent123"));
				agent.setRole(User.UserRole.AGENT);

				// Create 3 customer users with phone numbers and policy numbers
				User customer1 = new User();
				customer1.setName("John Doe");
				customer1.setEmail("john@example.com");
				customer1.setPassword(passwordEncoder.encode("customer123"));
				customer1.setRole(User.UserRole.CUSTOMER);
				customer1.setPhoneNumber("+1 (555) 123-4567");
				customer1.setPolicyNumber("POL-20250109001");

				User customer2 = new User();
				customer2.setName("Jane Smith");
				customer2.setEmail("jane@example.com");
				customer2.setPassword(passwordEncoder.encode("customer123"));
				customer2.setRole(User.UserRole.CUSTOMER);
				customer2.setPhoneNumber("+1 (555) 234-5678");
				customer2.setPolicyNumber("POL-20250109002");

				User customer3 = new User();
				customer3.setName("Bob Johnson");
				customer3.setEmail("bob@example.com");
				customer3.setPassword(passwordEncoder.encode("customer123"));
				customer3.setRole(User.UserRole.CUSTOMER);
				customer3.setPhoneNumber("+1 (555) 345-6789");
				customer3.setPolicyNumber("POL-20250109003");

				userRepository.save(admin);
				userRepository.save(agent);
				userRepository.save(customer1);
				userRepository.save(customer2);
				userRepository.save(customer3);

				System.out.println("");
				System.out.println("============================================");
				System.out.println("✅ Seeded Default Users:");
				System.out.println("   Admin: admin@example.com / admin123");
				System.out.println("   Agent: agent@example.com / agent123");
				System.out.println("   Customers:");
				System.out.println("     - john@example.com / customer123 (Policy: POL-2025010900 1)");
				System.out.println("     - jane@example.com / customer123 (Policy: POL-20250109002)");
				System.out.println("     - bob@example.com / customer123 (Policy: POL-20250109003)");
				System.out.println("============================================");
				System.out.println("");
			}
		};
	}

	@Bean
	public CommandLineRunner initClaimTypes(ClaimTypeRepository claimTypeRepository) {
		return args -> {
			if (claimTypeRepository.count() == 0) {
				claimTypeRepository.save(new ClaimType("Auto Insurance"));
				claimTypeRepository.save(new ClaimType("Home Insurance"));
				claimTypeRepository.save(new ClaimType("Health Insurance"));
				claimTypeRepository.save(new ClaimType("Travel Insurance"));
				claimTypeRepository.save(new ClaimType("Life Insurance"));
				claimTypeRepository.save(new ClaimType("Property Insurance"));

				System.out.println("✅ Seeded " + claimTypeRepository.count() + " claim types");
				System.out.println("");
			}
		};
	}
}

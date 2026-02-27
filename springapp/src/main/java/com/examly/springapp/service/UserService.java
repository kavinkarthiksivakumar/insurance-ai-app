package com.examly.springapp.service;

import com.examly.springapp.model.User;
import com.examly.springapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Normal login (no JWT)
    public Optional<User> authenticate(String email, String password) {
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty())
            return Optional.empty();

        User user = optionalUser.get();
        if (!user.getPassword().equals(password))
            return Optional.empty();

        return Optional.of(user);
    }

    // Registration with auto-generated policy number
    public User registerUser(String email, String password, String name, String role, String phoneNumber,
            String aadharNumber) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User already exists");
        }

        if (userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new RuntimeException("Phone number is already registered");
        }

        if (userRepository.existsByAadharNumber(aadharNumber)) {
            throw new RuntimeException("Aadhar number is already registered");
        }

        User.UserRole userRole = User.UserRole.valueOf(role.toUpperCase());
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setRole(userRole);
        user.setPhoneNumber(phoneNumber);
        user.setAadharNumber(aadharNumber);

        // Auto-generate unique policy number for customers
        if (userRole == User.UserRole.CUSTOMER) {
            user.setPolicyNumber(generatePolicyNumber());
        }

        return userRepository.save(user);
    }

    private String generatePolicyNumber() {
        // Generate unique policy number: POL-YYYYMMDDxxx (xxx = random 3 digits)
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String datePart = String.format("%04d%02d%02d",
                now.getYear(), now.getMonthValue(), now.getDayOfMonth());
        String randomPart = String.format("%03d", new java.util.Random().nextInt(1000));
        return "POL-" + datePart + randomPart;
    }
}

package com.example.demo.user.controller;

import com.example.demo.user.entity.VehicleEntity;
import com.example.demo.user.service.UserService;
import com.example.demo.user.service.ViolationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/violation")
public class ViolationController {

    private final UserService userService;
    private final ViolationService violationService;

    public ViolationController(UserService userService, ViolationService violationService) {
        this.userService = userService;
        this.violationService = violationService;
    }

    @GetMapping("/increase")
    public ResponseEntity<Map<String, Object>> increaseStrikeGet(@RequestParam String vehicleNumber) {
        return increaseStrike(vehicleNumber);
    }

    @PostMapping("/increase")
    public ResponseEntity<Map<String, Object>> increaseStrikePost(@RequestParam String vehicleNumber) {
        return increaseStrike(vehicleNumber);
    }

    private ResponseEntity<Map<String, Object>> increaseStrike(String vehicleNumber) {
        if (vehicleNumber == null || vehicleNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vehicle number is required"));
        }

        vehicleNumber = vehicleNumber.trim().toUpperCase();
        Optional<VehicleEntity> vehicleOpt = userService.findVehicleByNumber(vehicleNumber);
        if (vehicleOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vehicle not found"));
        }

        return ResponseEntity.ok(violationService.increaseStrike(vehicleOpt.get()));
    }

    @GetMapping("/details")
    public ResponseEntity<Map<String, Object>> getViolationDetails(@RequestParam String vehicleNumber) {
        if (vehicleNumber == null || vehicleNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vehicle number is required"));
        }

        vehicleNumber = vehicleNumber.trim().toUpperCase();
        Optional<VehicleEntity> vehicleOpt = userService.findVehicleByNumber(vehicleNumber);
        if (vehicleOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vehicle not found"));
        }

        return ResponseEntity.ok(violationService.getViolationDetails(vehicleOpt.get()));
    }
}

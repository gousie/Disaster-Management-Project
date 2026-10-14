package com.klu.controller;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/climate")
@CrossOrigin(origins = "http://localhost:5173")
public class ClimateController {

    @GetMapping
    public Map<String, Object> getClimate(
            @RequestParam double latitude,
            @RequestParam double longitude) {

        /*
         * Demo climate response.
         *
         * Replace this with Open-Meteo or another
         * weather provider when you connect a live API.
         */

        return Map.of(
                "location", "Guntur",
                "temperature", 31,
                "humidity", 68,
                "windSpeed", 12,
                "rainfall", 0,
                "condition", "Partly Cloudy"
        );
    }
}
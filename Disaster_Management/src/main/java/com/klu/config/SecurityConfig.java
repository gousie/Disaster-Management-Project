
package com.klu.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())

            .sessionManagement(sm ->
                sm.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(auth -> auth

                // Allow CORS preflight requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Authentication
                .requestMatchers("/api/auth/**").permitAll()

                // Public read operations
                .requestMatchers(HttpMethod.GET, "/api/disasters/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/alerts/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/climate/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/media/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/volunteers/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/resources/**").permitAll()

                // Funds and payments
                .requestMatchers(HttpMethod.POST, "/api/funds/create-order").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/funds/verify").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/funds/my/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/funds").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/funds/**").hasRole("ADMIN")

                // Disaster management
                .requestMatchers(HttpMethod.POST, "/api/disasters/**")
                    .hasAnyRole("ADMIN", "USER")
                .requestMatchers(HttpMethod.PUT, "/api/disasters/**")
                    .hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/disasters/**")
                    .hasRole("ADMIN")

                // Alerts
                .requestMatchers(HttpMethod.POST, "/api/alerts/**")
                    .hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/alerts/**")
                    .hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/alerts/**")
                    .hasRole("ADMIN")

                // Media
                .requestMatchers(HttpMethod.POST, "/api/media/**").permitAll()
                .requestMatchers(HttpMethod.DELETE, "/api/media/**")
                    .hasRole("ADMIN")

                // Public static resources and API documentation
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/v3/api-docs/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/**").hasRole("ADMIN")
                // All other routes require authentication
                .anyRequest().authenticated()
            )

            .addFilterBefore(
                jwtAuthFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        // Allowed frontend origins
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5176",
            "http://localhost:5177",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5176",
            "http://127.0.0.1:5177",
            "https://disaster-management-project-seven.vercel.app",
            "https://disaster-management-project-lime.vercel.app"
        ));

        // Allowed HTTP methods
        configuration.setAllowedMethods(List.of(
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}

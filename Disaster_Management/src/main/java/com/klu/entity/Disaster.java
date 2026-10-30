package com.klu.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "disasters")
public class Disaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String type;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String severity;

    private String location;

    private Double latitude;

    private Double longitude;

    private String status;

    /** Primary image URL (uploaded or external). Persisted so User & Admin see the same image. */
    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    /**
     * Extra details shown when user opens the post
     * (safety tips, evacuation routes, contacts, updates…).
     */
    @Column(name = "extra_details", columnDefinition = "TEXT")
    private String extraDetails;

    /**
     * Extra gallery image URLs (slideshow on post click).
     * Table: disaster_gallery
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "disaster_gallery",
            joinColumns = @JoinColumn(name = "disaster_id")
    )
    @Column(name = "image_url", length = 2048)
    @OrderColumn(name = "sort_order")
    private List<String> gallery = new ArrayList<>();

    /**
     * Extra video URLs (play + download on post click).
     * Table: disaster_videos
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "disaster_videos",
            joinColumns = @JoinColumn(name = "disaster_id")
    )
    @Column(name = "video_url", length = 2048)
    @OrderColumn(name = "sort_order")
    private List<String> videos = new ArrayList<>();

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void createDate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (gallery == null) gallery = new ArrayList<>();
        if (videos == null) videos = new ArrayList<>();
    }

    @PreUpdate
    public void updateDate() {
        updatedAt = LocalDateTime.now();
        if (gallery == null) gallery = new ArrayList<>();
        if (videos == null) videos = new ArrayList<>();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getExtraDetails() { return extraDetails; }
    public void setExtraDetails(String extraDetails) { this.extraDetails = extraDetails; }

    public List<String> getGallery() { return gallery; }
    public void setGallery(List<String> gallery) {
        this.gallery = gallery != null ? gallery : new ArrayList<>();
    }

    public List<String> getVideos() { return videos; }
    public void setVideos(List<String> videos) {
        this.videos = videos != null ? videos : new ArrayList<>();
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

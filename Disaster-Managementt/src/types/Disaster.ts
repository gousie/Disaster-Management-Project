export interface Disaster {
    id?: number;
    title: string;
    type: string;
    description: string;
    severity: string;
    location: string;
    latitude?: number;
    longitude?: number;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}
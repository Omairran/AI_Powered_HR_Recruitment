import React, { useState, useEffect } from "react";
import axios from "axios";

const JobList = () => {
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        axios.get("http://127.0.0.1:8000/api/job_posting/jobs/")
            .then(response => setJobs(response.data))
            .catch(error => console.error("Error fetching job data:", error));
    }, []);

    return (
        <div style={styles.container}>
            <h1 style={styles.heading}>Available Jobs</h1>
            <div style={styles.jobList}>
                {jobs.map(job => (
                    <div key={job.id} style={styles.jobPost}>
                        <h2 style={styles.jobTitle}>{job.title}</h2>
                        <img 
                            src={`http://127.0.0.1:8000${job.image}`} 
                            alt={job.title}
                            style={{ width: '10px' }}
                        />
                        <p><strong>Requirements:</strong> {job.requirements}</p>
                        <p><strong>Experience:</strong> {job.experience}</p>
                        <p><strong>Domain:</strong> {job.domain}</p>
                        <p><strong>Area of Study:</strong> {job.area_of_study}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "'Arial', sans-serif",
        backgroundColor: "#f9f9f9",
        borderRadius: "10px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        color:"black",
    },
    heading: {
        textAlign: "center",
        marginBottom: "20px",
        fontSize: "2rem",
        color: "#333",
    },
    jobList: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "20px",
    },
    jobPost: {
        backgroundColor: "#ffffff",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "15px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        transition: "transform 0.2s",
    },
    jobPostHover: {
        transform: "scale(1.05)",
    },
    jobTitle: {
        fontSize: "1.5rem",
        marginBottom: "10px",
        color: "#444",
    },
    jobImage: {
        width: "100%",
        height: "auto",
        borderRadius: "8px",
        marginBottom: "10px",
    },
};

export default JobList;

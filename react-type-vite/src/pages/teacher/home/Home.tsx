import React from 'react';

const TeacherHomePage: React.FC = () => {
    return (
        <div className="container mx-auto mt-10">
            <h1 className="text-4xl font-bold">Welcome to Teacher's Dashboard</h1>
            <p className="mt-4">This is the main dashboard for teachers. You can manage your courses, students, and other resources from here.</p>
        </div>
    );
};

export default TeacherHomePage;
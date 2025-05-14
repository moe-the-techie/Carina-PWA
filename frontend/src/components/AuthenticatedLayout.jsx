import React from 'react';
import NavigationBar from './NavigationBar';

export default function AuthenticatedLayout ({ children }) {
    return (
        <div className="h-[90vh] pb-16 md:pb-0">
            <NavigationBar />
            <main className="pt-16 md:pt-20">{children}</main>
        </div>
    );
}

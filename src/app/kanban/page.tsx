"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import KanbanBoard from '../components/KanbanBoard';
import { KanbanProvider } from '../context/KanbanContext';

const KanbanPage = () => {
  const [firstName, setFirstName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedFirstName = localStorage.getItem('firstName');
    if (storedFirstName) {
      setFirstName(storedFirstName);
    } else {
      router.push('/login'); // Redirect to login if firstName is not found
    }
  }, [router]);
  
  

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <KanbanProvider>
        <KanbanBoard />
      </KanbanProvider>
    </div>
  );
};

export default KanbanPage;
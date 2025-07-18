
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Huddle } from '@/types/huddle';

export const useHuddleList = () => {
  const [huddleList, setHuddleList] = useState<Huddle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const huddleRef = collection(db, 'huddleRegulaFacil');
    const q = query(huddleRef, orderBy('data', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const huddleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        data: doc.data().data?.toDate() || new Date()
      })) as Huddle[];
      
      setHuddleList(huddleData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { huddleList, loading };
};

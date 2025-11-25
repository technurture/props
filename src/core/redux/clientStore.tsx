"use client";
import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from './store';

export default function ClientStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<ReturnType<typeof makeStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}

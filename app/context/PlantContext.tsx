"use client";

import { createContext, useContext, useState } from "react";

type PlantContextType = {
  plantCount: number;
  setPlantCount: (count: number) => void;
};

const PlantContext = createContext<PlantContextType>({
  plantCount: 0,
  setPlantCount: () => {},
});

export const usePlant = () => useContext(PlantContext);

export const PlantProvider = ({ children }: any) => {
  const [plantCount, setPlantCount] = useState(0);

  return (
    <PlantContext.Provider value={{ plantCount, setPlantCount }}>
      {children}
    </PlantContext.Provider>
  );
};
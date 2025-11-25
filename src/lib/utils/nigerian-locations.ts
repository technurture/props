import nigerianLocationsData from '@/core/data/nigerian-locations.json';

export interface NigerianWard {
  value: string;
  label: string;
}

export interface NigerianLGA {
  value: string;
  label: string;
  wards: string[];
}

export interface NigerianState {
  value: string;
  label: string;
  lgas: {
    value: string;
    label: string;
    wards: string[];
  }[];
}

export function formatLocationName(name: string): string {
  if (!name) return '';
  
  return name
    .split('-')
    .map(word => {
      if (word.match(/^[ivx]+$/i)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function formatNameToSlug(name: string): string {
  if (!name) return '';
  
  return name
    .trim()
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getStates(): { value: string; label: string }[] {
  return nigerianLocationsData.map((stateData) => ({
    value: stateData.state,
    label: formatLocationName(stateData.state),
  })).sort((a, b) => a.label.localeCompare(b.label));
}

export function getLGAsForState(stateName: string): { value: string; label: string }[] {
  if (!stateName) return [];
  
  const stateData = nigerianLocationsData.find(
    (state) => state.state.toLowerCase() === stateName.toLowerCase()
  );
  
  if (!stateData) return [];
  
  return stateData.lgas.map((lga) => ({
    value: lga.lga,
    label: formatLocationName(lga.lga),
  })).sort((a, b) => a.label.localeCompare(b.label));
}

export function getWardsForLGA(stateName: string, lgaName: string): { value: string; label: string }[] {
  if (!stateName || !lgaName) return [];
  
  const stateData = nigerianLocationsData.find(
    (state) => state.state.toLowerCase() === stateName.toLowerCase()
  );
  
  if (!stateData) return [];
  
  const lgaData = stateData.lgas.find(
    (lga) => lga.lga.toLowerCase() === lgaName.toLowerCase()
  );
  
  if (!lgaData) return [];
  
  return lgaData.wards.map((ward) => ({
    value: ward,
    label: formatLocationName(ward),
  })).sort((a, b) => a.label.localeCompare(b.label));
}

export function validateLocation(stateName: string, lgaName?: string, wardName?: string): boolean {
  const states = getStates();
  const stateExists = states.some(s => s.value.toLowerCase() === stateName.toLowerCase());
  
  if (!stateExists) return false;
  
  if (lgaName) {
    const lgas = getLGAsForState(stateName);
    const lgaExists = lgas.some(l => l.value.toLowerCase() === lgaName.toLowerCase());
    
    if (!lgaExists) return false;
    
    if (wardName) {
      const wards = getWardsForLGA(stateName, lgaName);
      const wardExists = wards.some(w => w.value.toLowerCase() === wardName.toLowerCase());
      
      return wardExists;
    }
  }
  
  return true;
}

export function getLocationLabel(locationValue: string): string {
  return formatLocationName(locationValue);
}

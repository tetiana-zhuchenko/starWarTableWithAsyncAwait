async function fetchDataPlanets() {
  const fetchPromise = await fetch('https://swapi.dev/api/planets');
  const planetsList = await fetchPromise.json();
  const planetsWithResidents = await planetsList.results.flatMap(
    (planetItem) => {
      const planet = planetItem.name;
      const residents = planetItem.residents.map((residentItem) => {
        return {
          planet: planet,
          resident: residentItem,
        };
      });
      return residents;
    }
  );

  const fulfilledResidents = await Promise.allSettled(
    planetsWithResidents.map((residentItem) => {
      return fetch(residentItem.resident);
    })
  );

  const residentsData = await Promise.allSettled(
    fulfilledResidents.map((fulfiledItem) => fulfiledItem.value.json())
  );

  const planetsWithResidentsName = await planetsWithResidents.map(
    (planetItem, index) => {
      return new Resident(
        planetItem.planet,
        residentsData[index].value.name,
        residentsData[index].value.species
      );
    }
  );

  const fulfilmentSpecies = await Promise.allSettled(
    planetsWithResidentsName.map((item) => fetch(item.species))
  );

  const spesiesData = await Promise.allSettled(
    fulfilmentSpecies.map((fulfiledItem) => fulfiledItem.value.json())
  );

  const result = await planetsWithResidentsName.map((planetItem, index) => {
    const species =
      spesiesData[index].status === 'fulfilled'
        ? spesiesData[index].value.name
        : 'Human';
    return new Resident(planetItem.planet, planetItem.resident, species);
  });
  console.table(result);
}

class Resident {
  constructor(planet, residentName, species) {
    this.planet = planet;
    this.resident = residentName;
    this.species = species;
  }
}
fetchDataPlanets();

// Fonction pour charger les données CSV
async function loadCSVData() {
  const response = await fetch('population_monde.csv');
  const data = await response.text();

  const rows = data.split('\n').slice(1);
  const populationData = rows.map(row => {
    const [zone, annee, population] = row.split(',');
    return { zone: zone.trim(), annee: parseInt(annee), population: parseFloat(population) };
  }).filter(item => !isNaN(item.annee) && !isNaN(item.population));

  console.log("Données CSV chargées :", populationData);
  return populationData;
}

// Fonction pour préparer les données pour le graphique
function prepareChartData(populationData, selectedZone) {
  const years = [...new Set(populationData.map(item => item.annee))].sort((a, b) => a - b);
  const filteredData = selectedZone ? populationData.filter(item => item.zone === selectedZone) : populationData;
  const zones = selectedZone ? [selectedZone] : [...new Set(filteredData.map(item => item.zone))];

  const datasets = zones.map(zone => {
    const data = years.map(year => {
      const entry = filteredData.find(item => item.zone === zone && item.annee === year);
      return entry ? entry.population : 0;
    });
    return {
      label: zone,
      data: data,
      fill: false,
      borderColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`,
      tension: 0.3
    };
  });

  return { years, datasets };
}

// Fonction pour afficher le graphique
async function displayChart(selectedZone = null) {
  const populationData = await loadCSVData();
  const { years, datasets } = prepareChartData(populationData, selectedZone);

  const ctx = document.getElementById('populationChart').getContext('2d');
  if (window.populationChart && typeof window.populationChart.destroy === 'function') {
    window.populationChart.destroy();  // Détruire le graphique précédent pour le mettre à jour
  }
  window.populationChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              size: 14
            }
          }
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context) {
              return `Population: ${context.raw.toLocaleString()} millions`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Population (en millions)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Année'
          }
        }
      }
    }
  });
}

// Fonction pour générer une liste déroulante de zones
async function generateZoneDropdown() {
  const populationData = await loadCSVData();
  const zones = [...new Set(populationData.map(item => item.zone))];

  const dropdown = document.getElementById('zoneDropdown');
  dropdown.innerHTML = '<option value="">Toutes les zones</option>';
  zones.forEach(zone => {
    const option = document.createElement('option');
    option.value = zone;
    option.textContent = zone;
    dropdown.appendChild(option);
  });

  dropdown.addEventListener('change', (event) => {
    const selectedZone = event.target.value || null;
    displayChart(selectedZone);
  });
}

// Fonction pour télécharger les données affichées
async function addDownloadButton() {
  const button = document.getElementById('downloadButton');
  button.addEventListener('click', async () => {
    const populationData = await loadCSVData();
    const selectedZone = document.getElementById('zoneDropdown').value || null;
    const filteredData = selectedZone
      ? populationData.filter(item => item.zone === selectedZone)
      : populationData;

    const csvContent = 'Zone géographique,Année,Population\n' +
      filteredData.map(item => `${item.zone},${item.annee},${item.population}`).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'population_data.csv';
    link.click();
  });
}

// Initialiser les contrôles et le graphique
generateZoneDropdown();
addDownloadButton();
displayChart();

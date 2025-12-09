
import { Transaction } from '../types';

export const exportToCSV = (transactions: Transaction[]) => {
  // Headers solicitados: fecha, categoria, nombre, cantidad, tipo
  // ID eliminado
  const headers = ['fecha', 'categoria', 'nombre', 'cantidad', 'tipo'];
  
  const csvRows = [
    headers.join(','),
    ...transactions.map(t => {
      // Escape quotes in description
      const escapedDesc = `"${t.description.replace(/"/g, '""')}"`;
      
      // Lógica de signos: Gastos en negativo, Ingresos en positivo
      const signedAmount = t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount);
      
      // Etiquetas de tipo
      const tipoLabel = t.type === 'income' ? 'ingreso' : 'gasto';

      return [
        t.date,           // fecha (Index 0)
        t.category,       // categoria (Index 1)
        escapedDesc,      // nombre (Index 2)
        signedAmount.toFixed(2), // cantidad (Index 3)
        tipoLabel         // tipo (Index 4)
      ].join(',');
    })
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `finanza_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const parseCSV = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        reject('Archivo vacío');
        return;
      }

      try {
        const rows = text.split('\n');
        const transactions: Transaction[] = [];
        
        // Asumimos que la primera fila es el header o empezamos desde el índice 1
        // Nuevo orden esperado: fecha, categoria, nombre, cantidad, tipo
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].trim();
          if (!row) continue;

          // Regex para manejar comillas en descripciones (nombre)
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          
          const cols = matches 
            ? matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"')) 
            : row.split(',');

          // Necesitamos al menos hasta cantidad (índice 3) para procesar
          if (cols.length >= 4) {
             // Mapeo basado en el nuevo orden:
             // 0: fecha
             // 1: categoria
             // 2: nombre (descripcion)
             // 3: cantidad
             // 4: tipo (opcional, usaremos el signo de cantidad como prioridad)

             const rawDate = cols[0];
             const category = cols[1] || 'Otros';
             const description = cols[2] || 'Sin nombre';
             const rawAmount = parseFloat(cols[3]);

             if (isNaN(rawAmount)) continue;

             // Lógica: Si es negativo -> Gasto. Si es positivo -> Ingreso.
             let type: 'income' | 'expense';
             
             if (rawAmount < 0) {
               type = 'expense';
             } else {
               type = 'income';
             }

             // Internamente usamos valores absolutos para la cantidad
             const amount = Math.abs(rawAmount);

             transactions.push({
               id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Generar ID nuevo
               description: description,
               date: rawDate || new Date().toISOString().split('T')[0],
               category: category,
               amount: amount,
               type: type
             });
          }
        }
        resolve(transactions);
      } catch (e) {
        console.error(e);
        reject('Error al procesar el archivo CSV. Asegúrate de usar el formato correcto.');
      }
    };

    reader.onerror = () => reject('Error leyendo el archivo');
    reader.readAsText(file);
  });
};


import { Transaction } from '../types';

/**
 * Parsea una línea CSV respetando comillas dobles.
 * Evita romper textos que contengan comas si están entre comillas (ej: "-3,60 €").
 */
const parseCSVLine = (text: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      // No añadimos la comilla al contenido final para limpiarlo automáticamente
      continue; 
    }
    
    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

export const exportToCSV = (transactions: Transaction[]) => {
  // Headers solicitados: fecha, categoria, nombre, cantidad, tipo
  const headers = ['fecha', 'categoria', 'nombre', 'cantidad', 'tipo'];
  
  const csvRows = [
    headers.join(','),
    ...transactions.map(t => {
      // 1. Fecha: YYYY/MM/DD
      const dateObj = new Date(t.date);
      const formattedDate = `${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;
      
      // 2. Descripción: Escapar comillas si existen
      const description = t.description.includes(',') ? `"${t.description}"` : t.description;
      
      // 3. Cantidad: "-3,60 €"
      // Lógica de signos: Gastos en negativo, Ingresos en positivo
      const signedAmount = t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount);
      const amountStr = `"${signedAmount.toFixed(2).replace('.', ',')} €"`;
      
      // 4. Tipo
      const tipoLabel = t.type === 'income' ? 'Ingreso' : 'Gasto';

      return [
        formattedDate,    // fecha
        t.category,       // categoria
        description,      // nombre
        amountStr,        // cantidad
        tipoLabel         // tipo
      ].join(',');
    })
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
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
        
        // Empezamos desde i=1 para saltar el header
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].trim();
          if (!row) continue;

          // Usamos el parser robusto en lugar de split(',')
          const cols = parseCSVLine(row);

          // Formato esperado:
          // 0: fecha (2025/12/02)
          // 1: categoria (Capricho)
          // 2: nombre (cepillo y pasta)
          // 3: cantidad ("-3,60 €")
          // 4: tipo (Gasto)

          if (cols.length >= 4) {
             const rawDate = cols[0]; // "2025/12/02"
             const category = cols[1] || 'Otros';
             const description = cols[2] || 'Sin nombre';
             let rawAmountStr = cols[3]; // "-3,60 €" (ya sin comillas exteriores gracias a parseCSVLine)

             // Limpieza de cantidad: Quitar '€', espacios y cambiar coma por punto
             // "-3,60 €" -> "-3.60"
             rawAmountStr = rawAmountStr.replace(/€/g, '').replace(/\s/g, '').replace(',', '.');
             const rawAmount = parseFloat(rawAmountStr);

             if (isNaN(rawAmount)) continue;

             // Convertir fecha de YYYY/MM/DD a YYYY-MM-DD para el sistema
             const isoDate = rawDate.replace(/\//g, '-');

             // Determinar tipo basado en el signo
             let type: 'income' | 'expense';
             if (rawAmount < 0) {
               type = 'expense';
             } else {
               type = 'income';
             }

             const amount = Math.abs(rawAmount);

             transactions.push({
               id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
               description: description,
               date: isoDate,
               category: category,
               amount: amount,
               type: type
             });
          }
        }
        resolve(transactions);
      } catch (e) {
        console.error(e);
        reject('Error al procesar el archivo CSV.');
      }
    };

    reader.onerror = () => reject('Error leyendo el archivo');
    reader.readAsText(file);
  });
};

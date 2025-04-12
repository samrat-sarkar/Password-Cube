document.addEventListener("DOMContentLoaded", () => {
  const recordTable = document.getElementById("recordTable");
  let hasRecords = false;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    try {
      const record = JSON.parse(localStorage.getItem(key));
	  
	  const PASSWORD_EXPIRY_DAYS = 30;
	  
      if (record && record.domain && record.setDate) {
        const creationDate = new Date(record.setDate);
        const expirationDate = new Date(creationDate);
        expirationDate.setDate(creationDate.getDate() + PASSWORD_EXPIRY_DAYS);

        const currentDate = new Date();
        const timeDiff = expirationDate - currentDate;
        const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

        const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const formattedCreationDate = creationDate.toLocaleDateString('en-GB', dateOptions); 
        const formattedExpirationDate = expirationDate.toLocaleDateString('en-GB', dateOptions); 

        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${record.domain}</td>
          <td>${formattedCreationDate}</td>
          <td>${formattedExpirationDate}</td>
          <td>${daysLeft} day${daysLeft === 1 ? "" : "s"}</td>
        `;

        recordTable.appendChild(row);
        hasRecords = true;
      }
    } catch (e) {
      console.warn(`Invalid record for key "${key}":`, e);
    }
  }

  if (!hasRecords) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="4" class="no-records">No Records Found.</td>`;
    recordTable.appendChild(row);
  }
});

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public caluclateTaxByYearSource = new BehaviorSubject<Array<any>>([]);
  public caluclateTaxByYearData$ = this.caluclateTaxByYearSource.asObservable();

  private dataSource = new BehaviorSubject<Array<Object>>([]);
  public currentData$ = this.dataSource.asObservable();

  constructor() {
    this.fetchData()
  }

  fetchData() {
    let temp = new Array();
    let promiseArray: Promise<any[]>[] = []

    // First get the total count
    fetch(`https://skatteverket.entryscape.net/rowstore/dataset/c67b320b-ffee-4876-b073-dd9236cd2a99/json?_limit=1`)
      .then(response => response.json())
      .then(data => {
        const totalRecords = data.resultCount;
        console.log('Total records to fetch:', totalRecords);
        
        // Create requests for all records
        for (let i = 0; i < totalRecords; i += 500) {
          promiseArray.push(this.fetchCycle(i))
        }

        Promise.all(promiseArray).then(
          list => {
            list.forEach(fetchCallResults => fetchCallResults.forEach((row: any) => temp.push(row)))
            // Log available years
            const years = [...new Set(temp.map((row: any) => row['år']))].sort((a, b) => b - a);
            console.log('Available years from API:', years);
            console.log('Total records fetched:', temp.length);
            this.dataSource.next(temp);
          }
        )
      })
      .catch(error => console.error('Error fetching data:', error));
  }

  fetchCycle(i: number): Promise<any[]> {
    return fetch(`https://skatteverket.entryscape.net/rowstore/dataset/c67b320b-ffee-4876-b073-dd9236cd2a99/json?_offset=${i}&_limit=500`).then(response => {
      if (!response.ok)
        throw new Error(`https://skatteverket.entryscape.net/rowstore/dataset/c67b320b-ffee-4876-b073-dd9236cd2a99 returned status ${response.status}`);
      return response.json()
    })
      .then(data => {
        return data.results
      })
      .catch(error => {
        console.error(`Error in fetch cycle ${i}:`, error);
        return [];
      });
  }

  getKommunList(): string[] {
    const kommunSet = new Set<string>();
    this.dataSource.value.forEach((row: any) => {
      kommunSet.add(row['kommun']);
    });
    return Array.from(kommunSet);
  }
}





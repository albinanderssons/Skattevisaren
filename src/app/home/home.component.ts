import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DataService } from '../data.service';
import { MatPaginator} from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit{
  displayedColumns: string[] = ['kommun', 'skatt', 'year', 'buttons'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  filterValueKommun: string = '';
  filterValueSkatt: string = '';
  filterValueYear: string = '';
  availableYears: number[] = [];
  latestYear: number = 0;
  uniqueMunicipalityCount: number = 0;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private service: DataService, private router: Router) { }

  ngOnInit() {
    this.service.currentData$.subscribe(data => {
      // Get all available years and find the latest
      this.availableYears = [...new Set(data.map((row: any) => row['år']))];
      this.latestYear = Math.max(...this.availableYears);
      
      // Process data for all years
      const processedData = this.processDataForAllYears(data);
      this.dataSource = new MatTableDataSource(processedData);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      
      // Calculate unique municipalities
      this.calculateUniqueCount();
    });
  }

  processDataForAllYears(data: any[]): any[] {
    const result: any[] = [];
    
    // Group data by municipality
    const municipalities = [...new Set(data.map((row: any) => row['kommun']))];
    
    municipalities.forEach(municipality => {
      // Get data for this municipality
      const municipalityData = data.filter((row: any) => row['kommun'] === municipality);
      
      // Group by year
      const years = [...new Set(municipalityData.map((row: any) => row['år']))].sort((a, b) => b - a);
      
      years.forEach(year => {
        const yearData = municipalityData.filter((row: any) => row['år'] === year);
        
        // Calculate average tax rate for this year
        const totalTax = yearData.reduce((sum, row) => sum + parseFloat(row['summa, exkl. kyrkoavgift']), 0);
        const avgTax = totalTax / yearData.length;
        
        result.push({
          kommun: municipality,
          skatt: avgTax.toFixed(2),
          year: year
        });
      });
    });
    
    return result;
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event : Event) {
    switch ((event.target as HTMLInputElement).name) {
      case 'kommun':
        this.filterValueSkatt = '';
        this.filterValueYear = '';
        this.dataSource.filter = this.filterValueKommun.trim().toLowerCase();
        this.dataSource.filterPredicate = (data: any, filter: string) => data.kommun.toLowerCase().startsWith(filter);
        break;
      case 'skatt':
        this.filterValueKommun = '';
        this.filterValueYear = '';
        this.dataSource.filter = this.filterValueSkatt.trim().toLowerCase();
        this.dataSource.filterPredicate = (data: any, filter: string) => data.skatt.toString().startsWith(filter);
        break;
      case 'year':
        this.filterValueKommun = '';
        this.filterValueSkatt = '';
        this.dataSource.filter = this.filterValueYear.trim().toLowerCase();
        this.dataSource.filterPredicate = (data: any, filter: string) => data.year.toString().startsWith(filter);
        break;
      default: break;
    }
  }

  goToMunicipality(name : string) {
    this.router.navigate(['/municipality', name])
  }

  sortData(sort: MatSort) {
    const data = this.dataSource.filteredData.slice();
    if (!sort.active || sort.direction === '') {
      this.dataSource.data = data;
      return;
    }

    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'kommun': return compare(a.kommun, b.kommun, isAsc);
        case 'skatt': return compare(a.skatt, b.skatt, isAsc);
        case 'year': return compare(a.year, b.year, isAsc);
        default: return 0;
      }
    });
  }

  // Calculate the number of unique municipalities
  calculateUniqueCount() {
    if (this.dataSource && this.dataSource.data && this.dataSource.data.length > 0) {
      const uniqueSet = new Set(this.dataSource.data.map(row => row.kommun));
      this.uniqueMunicipalityCount = uniqueSet.size;
    } else {
      this.uniqueMunicipalityCount = 0;
    }
  }
}

function compare(a: string | number, b: string | number, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

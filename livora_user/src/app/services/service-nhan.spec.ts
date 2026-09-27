import { TestBed } from '@angular/core/testing';

import { ServiceNhan } from './service-nhan';

describe('ServiceNhan', () => {
  let service: ServiceNhan;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceNhan);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

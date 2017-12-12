import {TestBed, inject} from '@angular/core/testing';

import {ConstraintService} from './constraint.service';
import {TreeNodeService} from './tree-node.service';
import {TreeNodeServiceMock} from './mocks/tree-node.service.mock';

describe('ConstraintService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TreeNodeService,
          useClass: TreeNodeServiceMock
        },
        ConstraintService
      ]
    });
  });

  it('should inject ConstraintService', inject([ConstraintService], (service: ConstraintService) => {
    expect(service).toBeTruthy();
  }));
});

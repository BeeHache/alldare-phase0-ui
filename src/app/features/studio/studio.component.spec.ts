import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { StudioComponent } from './studio.component';
import { MediaService, MediaAsset } from '../../core/services/media.service';
import { PodcastService } from '../../core/services/podcast.service';
import { AuthService } from '../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('StudioComponent - UI Media Upload Integration Test', () => {
  let component: StudioComponent;
  let fixture: ComponentFixture<StudioComponent>;
  let mediaServiceMock: any;
  let podcastServiceMock: any;
  let authServiceMock: any;

  const mockUploadedAsset: MediaAsset = {
    id: 'asset-999',
    creatorId: '00000000-0000-0000-0000-000000000001',
    filename: 'sample-720p.mp4',
    originalName: 'sample-720p.mp4',
    title: 'Test Episode Video Upload',
    cdnUrl: 'https://cdn.alldare.online/media/vault/sample-720p.mp4',
    mediaType: 'video/mp4',
    durationSeconds: 120,
    fileSizeBytes: 882000,
    status: 'READY',
    createdAt: new Date().toISOString()
  };

  beforeEach(async () => {
    mediaServiceMock = {
      getMediaAssets: jasmine.createSpy('getMediaAssets').and.returnValue(of([])),
      uploadMediaAsset: jasmine.createSpy('uploadMediaAsset').and.returnValue(of(mockUploadedAsset)),
      deleteMediaAsset: jasmine.createSpy('deleteMediaAsset').and.returnValue(of(void 0))
    };

    podcastServiceMock = {
      getShowsByCreator: jasmine.createSpy('getShowsByCreator').and.returnValue(of([])),
      getEpisodesByShow: jasmine.createSpy('getEpisodesByShow').and.returnValue(of([])),
      getShowBySlug: jasmine.createSpy('getShowBySlug').and.returnValue(of(null))
    };

    authServiceMock = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({
        id: '00000000-0000-0000-0000-000000000001',
        username: 'testcreator',
        email: 'creator@alldare.online'
      })
    };

    await TestBed.configureTestingModule({
      imports: [StudioComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MediaService, useValue: mediaServiceMock },
        { provide: PodcastService, useValue: podcastServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'test-show' } },
            queryParams: of({})
          }
        },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudioComponent);
    component = fixture.componentInstance;
    spyOn(window, 'alert');
    fixture.detectChanges();
  });

  it('should instantiate the Studio component', () => {
    expect(component).toBeTruthy();
  });

  it('should alert if user attempts to upload without selecting a file', () => {
    component.selectedUploadFile.set(null);
    component.uploadToMediaVault();

    expect(window.alert).toHaveBeenCalledWith(
      'Please select an audio (.mp3, .flac, .wav) or video (.mp4, .mov) file to upload.'
    );
    expect(mediaServiceMock.uploadMediaAsset).not.toHaveBeenCalled();
  });

  it('should upload media asset through UI service and update media library signals', fakeAsync(() => {
    const dummyFile = new File(['dummy MP4 binary payload'], 'sample-720p.mp4', { type: 'video/mp4' });
    component.selectedUploadFile.set(dummyFile);
    component.newMediaTitle = 'Test Episode Video Upload';
    component.extractAudio.set(true);

    component.uploadToMediaVault();

    expect(component.isUploading()).toBe(false);
    expect(mediaServiceMock.uploadMediaAsset).toHaveBeenCalledWith(
      dummyFile,
      'Test Episode Video Upload',
      true
    );
    expect(component.mediaAssets().length).toBe(1);
    expect(component.mediaAssets()[0]).toEqual(mockUploadedAsset);
    expect(component.selectedMediaAsset()).toEqual(mockUploadedAsset);
    expect(component.selectedUploadFile()).toBeNull();
    expect(component.newMediaTitle).toBe('');
    expect(window.alert).toHaveBeenCalledWith('📁 Asset "Test Episode Video Upload" uploaded to Media Library!');
  }));

  it('should fallback to offline/mock upload mode when API endpoint is unreachable', fakeAsync(() => {
    mediaServiceMock.uploadMediaAsset.and.returnValue(throwError(() => new Error('API Unreachable')));

    const dummyAudioFile = new File(['dummy MP3 binary payload'], 'sample.mp3', { type: 'audio/mpeg' });
    component.selectedUploadFile.set(dummyAudioFile);
    component.newMediaTitle = 'Offline Test Track';
    component.extractAudio.set(false);

    component.uploadToMediaVault();

    expect(component.isUploading()).toBe(false);
    expect(component.mediaAssets().length).toBe(1);
    expect(component.mediaAssets()[0].filename).toBe('sample.mp3');
    expect(component.mediaAssets()[0].title).toBe('Offline Test Track');
    expect(component.selectedMediaAsset()?.title).toBe('Offline Test Track');
    expect(window.alert).toHaveBeenCalledWith(
      '📁 Asset "Offline Test Track" uploaded to Media Library!'
    );
  }));
});

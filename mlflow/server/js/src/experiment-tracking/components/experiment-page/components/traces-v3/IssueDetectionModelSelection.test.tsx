import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { waitFor } from '@testing-library/react';
import React from 'react';
import { renderWithDesignSystem } from '../../../../../common/utils/TestUtils.react18';
import { IssueDetectionModelSelection } from './IssueDetectionModelSelection';
import { useEndpointsQuery } from '../../../../../gateway/hooks/useEndpointsQuery';
import { useSecretsConfigQuery } from '../../../../../gateway/hooks/useSecretsConfigQuery';

jest.mock('../../../../../gateway/hooks/useEndpointsQuery');
jest.mock('../../../../../gateway/hooks/useSecretsConfigQuery');
jest.mock('../../../../../gateway/components/create-endpoint/ModelSelect', () => ({
  ModelSelect: () => <div data-testid="model-select">Model Select</div>,
}));
jest.mock('./IssueDetectionApiKeyConfigurator', () => ({
  IssueDetectionApiKeyConfigurator: () => <div data-testid="api-key-configurator">API Key Configurator</div>,
}));
jest.mock('./IssueDetectionAdvancedSettings', () => ({
  IssueDetectionAdvancedSettings: () => <div data-testid="advanced-settings">Advanced Settings</div>,
}));
jest.mock('../../../../../gateway/components/model-configuration/hooks/useApiKeyConfiguration', () => ({
  useApiKeyConfiguration: () => ({
    existingSecrets: [],
    authModes: [],
    defaultAuthMode: '',
    isLoadingProviderConfig: false,
  }),
}));

describe('IssueDetectionModelSelection', () => {
  const defaultProps = {
    selectedTraceIds: [],
    onSelectTracesClick: jest.fn(),
    onValidityChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('defaults to direct mode when provider backend is unavailable', async () => {
    jest.mocked(useSecretsConfigQuery).mockReturnValue({
      data: {
        secrets_available: true,
        using_default_passphrase: false,
        is_provider_backend_available: false,
      },
      isLoading: false,
    } as any);

    jest.mocked(useEndpointsQuery).mockReturnValue({
      data: [
        {
          endpoint_id: 'ep-1',
          name: 'test-endpoint',
          model_mappings: [],
          created_at: 0,
          last_updated_at: 0,
        },
      ],
      isLoading: false,
    } as any);

    const ref = React.createRef<any>();
    renderWithDesignSystem(<IssueDetectionModelSelection {...defaultProps} ref={ref} />);

    await waitFor(() => {
      expect(ref.current?.getValues().mode).toBe('direct');
    });
  });

  test('defaults to endpoint mode when provider backend is available and endpoints exist', async () => {
    jest.mocked(useSecretsConfigQuery).mockReturnValue({
      data: {
        secrets_available: true,
        using_default_passphrase: false,
        is_provider_backend_available: true,
      },
      isLoading: false,
    } as any);

    jest.mocked(useEndpointsQuery).mockReturnValue({
      data: [
        {
          endpoint_id: 'ep-1',
          name: 'test-endpoint',
          model_mappings: [],
          created_at: 0,
          last_updated_at: 0,
        },
      ],
      isLoading: false,
    } as any);

    const ref = React.createRef<any>();
    renderWithDesignSystem(<IssueDetectionModelSelection {...defaultProps} ref={ref} />);

    await waitFor(() => {
      expect(ref.current?.getValues().mode).toBe('endpoint');
    });
  });

  test('defaults to direct mode when provider backend is available but no endpoints exist', async () => {
    jest.mocked(useSecretsConfigQuery).mockReturnValue({
      data: {
        secrets_available: true,
        using_default_passphrase: false,
        is_provider_backend_available: true,
      },
      isLoading: false,
    } as any);

    jest.mocked(useEndpointsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    const ref = React.createRef<any>();
    renderWithDesignSystem(<IssueDetectionModelSelection {...defaultProps} ref={ref} />);

    await waitFor(() => {
      expect(ref.current?.getValues().mode).toBe('direct');
    });
  });

  test('falls back to secrets_available when is_provider_backend_available is undefined', async () => {
    jest.mocked(useSecretsConfigQuery).mockReturnValue({
      data: {
        secrets_available: true,
        using_default_passphrase: false,
        // is_provider_backend_available is undefined (old server)
      },
      isLoading: false,
    } as any);

    jest.mocked(useEndpointsQuery).mockReturnValue({
      data: [
        {
          endpoint_id: 'ep-1',
          name: 'test-endpoint',
          model_mappings: [],
          created_at: 0,
          last_updated_at: 0,
        },
      ],
      isLoading: false,
    } as any);

    const ref = React.createRef<any>();
    renderWithDesignSystem(<IssueDetectionModelSelection {...defaultProps} ref={ref} />);

    await waitFor(() => {
      // Should default to endpoint mode because secrets_available is true
      expect(ref.current?.getValues().mode).toBe('endpoint');
    });
  });

  test('shows loading state while fetching config', async () => {
    jest.mocked(useSecretsConfigQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    jest.mocked(useEndpointsQuery).mockReturnValue({
      data: [],
      isLoading: true,
    } as any);

    const { getByText } = renderWithDesignSystem(<IssueDetectionModelSelection {...defaultProps} />);

    expect(getByText('Loading endpoints...')).toBeInTheDocument();
  });

  test('hides endpoint dropdown when provider backend is unavailable', () => {
    jest.mocked(useSecretsConfigQuery).mockReturnValue({
      data: {
        secrets_available: true,
        using_default_passphrase: false,
        is_provider_backend_available: false,
      },
      isLoading: false,
    } as any);

    jest.mocked(useEndpointsQuery).mockReturnValue({
      data: [
        {
          endpoint_id: 'ep-1',
          name: 'test-endpoint',
          model_mappings: [],
          created_at: 0,
          last_updated_at: 0,
        },
      ],
      isLoading: false,
    } as any);

    const { queryByText } = renderWithDesignSystem(<IssueDetectionModelSelection {...defaultProps} />);

    // The endpoint dropdown should not be visible when provider backend is unavailable
    // So there should be no "Select endpoint" placeholder text
    expect(queryByText('Select endpoint')).not.toBeInTheDocument();
  });
});

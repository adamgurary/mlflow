import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { renderWithDesignSystem, screen } from '@mlflow/mlflow/src/common/utils/TestUtils.react18';
import { MemoryRouter, Route, Routes } from '../../common/utils/RoutingUtils';
import GatewayPage from './GatewayPage';

// Mock child components
jest.mock('../components/endpoints/EndpointsList', () => ({
  EndpointsList: () => <div data-testid="endpoints-list">Endpoints List</div>,
}));

jest.mock('../components/SecretsSetupGuide', () => ({
  GatewaySetupGuide: () => <div data-testid="setup-guide">Setup Guide</div>,
}));

jest.mock('../components/DefaultPassphraseBanner', () => ({
  DefaultPassphraseBanner: () => <div data-testid="default-passphrase-banner">Default Passphrase Banner</div>,
}));

jest.mock('../components/side-nav/GatewaySideNav', () => ({
  GatewaySideNav: () => <div data-testid="side-nav">Side Nav</div>,
}));

jest.mock('./ApiKeysPage', () => ({
  __esModule: true,
  default: () => <div data-testid="api-keys-page">API Keys Page</div>,
}));

jest.mock('./BudgetsPage', () => ({
  __esModule: true,
  default: () => <div data-testid="budgets-page">Budgets Page</div>,
}));

jest.mock('./GatewayUsagePage', () => ({
  __esModule: true,
  default: () => <div data-testid="usage-page">Usage Page</div>,
}));

// Mock hooks
const mockUseSecretsConfigQuery = jest.fn();
jest.mock('../hooks/useSecretsConfigQuery', () => ({
  useSecretsConfigQuery: () => mockUseSecretsConfigQuery(),
}));

jest.mock('../../common/utils/FeatureUtils', () => ({
  shouldEnableWorkflowBasedNavigation: () => false,
}));

describe('GatewayPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (initialPath = '/gateway') => {
    return renderWithDesignSystem(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/gateway/*" element={<GatewayPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  describe('when provider backend is available', () => {
    beforeEach(() => {
      mockUseSecretsConfigQuery.mockReturnValue({
        data: {
          secrets_available: true,
          using_default_passphrase: false,
          is_provider_backend_available: true,
        },
        isLoading: false,
      });
    });

    test('renders endpoints page on index route', () => {
      renderComponent('/gateway');

      expect(screen.getByText('Endpoints')).toBeInTheDocument();
      expect(screen.getByTestId('endpoints-list')).toBeInTheDocument();
      expect(screen.queryByTestId('setup-guide')).not.toBeInTheDocument();
    });

    test('renders API keys page on api-keys route', () => {
      renderComponent('/gateway/api-keys');

      expect(screen.getByTestId('api-keys-page')).toBeInTheDocument();
      expect(screen.queryByTestId('setup-guide')).not.toBeInTheDocument();
    });

    test('renders usage page on usage route', () => {
      renderComponent('/gateway/usage');

      expect(screen.getByTestId('usage-page')).toBeInTheDocument();
      expect(screen.queryByTestId('setup-guide')).not.toBeInTheDocument();
    });

    test('renders budgets page on budgets route', () => {
      renderComponent('/gateway/budgets');

      expect(screen.getByTestId('budgets-page')).toBeInTheDocument();
      expect(screen.queryByTestId('setup-guide')).not.toBeInTheDocument();
    });

    test('shows default passphrase banner when using default passphrase', () => {
      mockUseSecretsConfigQuery.mockReturnValue({
        data: {
          secrets_available: true,
          using_default_passphrase: true,
          is_provider_backend_available: true,
        },
        isLoading: false,
      });

      renderComponent('/gateway');

      expect(screen.getByTestId('default-passphrase-banner')).toBeInTheDocument();
    });
  });

  describe('when provider backend is unavailable', () => {
    beforeEach(() => {
      mockUseSecretsConfigQuery.mockReturnValue({
        data: {
          secrets_available: true,
          using_default_passphrase: false,
          is_provider_backend_available: false,
        },
        isLoading: false,
      });
    });

    test('shows setup guide on index route', () => {
      renderComponent('/gateway');

      expect(screen.getByTestId('setup-guide')).toBeInTheDocument();
      expect(screen.queryByTestId('endpoints-list')).not.toBeInTheDocument();
    });

    test('shows setup guide on usage route', () => {
      renderComponent('/gateway/usage');

      expect(screen.getByTestId('setup-guide')).toBeInTheDocument();
      expect(screen.queryByTestId('usage-page')).not.toBeInTheDocument();
    });

    test('shows setup guide on budgets route', () => {
      renderComponent('/gateway/budgets');

      expect(screen.getByTestId('setup-guide')).toBeInTheDocument();
      expect(screen.queryByTestId('budgets-page')).not.toBeInTheDocument();
    });

    test('shows API keys page on api-keys route (does not require provider backend)', () => {
      renderComponent('/gateway/api-keys');

      expect(screen.getByTestId('api-keys-page')).toBeInTheDocument();
      expect(screen.queryByTestId('setup-guide')).not.toBeInTheDocument();
    });
  });

  describe('backwards compatibility', () => {
    test('falls back to secrets_available when is_provider_backend_available is undefined', () => {
      mockUseSecretsConfigQuery.mockReturnValue({
        data: {
          secrets_available: true,
          using_default_passphrase: false,
          // is_provider_backend_available is undefined (old server)
        },
        isLoading: false,
      });

      renderComponent('/gateway');

      // Should render endpoints page since secrets_available is true
      expect(screen.getByText('Endpoints')).toBeInTheDocument();
      expect(screen.getByTestId('endpoints-list')).toBeInTheDocument();
      expect(screen.queryByTestId('setup-guide')).not.toBeInTheDocument();
    });

    test('shows setup guide when both are false/undefined', () => {
      mockUseSecretsConfigQuery.mockReturnValue({
        data: {
          secrets_available: false,
          using_default_passphrase: false,
          // is_provider_backend_available is undefined
        },
        isLoading: false,
      });

      renderComponent('/gateway');

      expect(screen.getByTestId('setup-guide')).toBeInTheDocument();
      expect(screen.queryByTestId('endpoints-list')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    test('shows loading spinner when config is loading', () => {
      mockUseSecretsConfigQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      renderComponent('/gateway');

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('endpoints-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('setup-guide')).not.toBeInTheDocument();
    });
  });
});

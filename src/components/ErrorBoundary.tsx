import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Colors, Spacing, Radius} from '../theme/tokens';

const CRASH_LOG_KEY = '@crash_log';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary to catch JS crashes in any screen
 * and display a recovery UI instead of a white screen.
 */
class ErrorBoundary extends React.Component<Props, State> {
  state: State = {hasError: false, error: null};

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Synchronous log first — guaranteed visibility
    console.error('[ErrorBoundary]', error.message, info.componentStack?.slice(0, 200));
    // Best-effort async storage (fire and forget)
    const entry = {
      message: error.message,
      stack: error.stack?.slice(0, 500),
      componentStack: info.componentStack?.slice(0, 300),
      timestamp: new Date().toISOString(),
    };
    try {
      AsyncStorage.getItem(CRASH_LOG_KEY).then(existing => {
        const logs = existing ? JSON.parse(existing) : [];
        logs.unshift(entry);
        AsyncStorage.setItem(CRASH_LOG_KEY, JSON.stringify(logs.slice(0, 10))).catch(() => {});
      }).catch(() => {});
    } catch (_) {}
  }

  handleReset = () => {
    this.setState({hasError: false, error: null});
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>SYSTEM ERROR</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={this.handleReset}>
            <Text style={styles.btnText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 3,
    marginBottom: Spacing.base,
  },
  message: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
  },
  btnText: {
    fontSize: 11,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
});

export default ErrorBoundary;

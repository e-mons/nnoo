import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function IndexPage() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#B8F25C" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1C16',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

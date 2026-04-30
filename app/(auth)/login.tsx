import { View, Text } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, color: 'black' }}>Tela de Login</Text>
      <Text style={{ color: 'black' }}>Funcionando!</Text>
    </View>
  );
}
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

function TabDot({ focused }: { focused: boolean }) {
  return (
    <View
      style={{
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: focused ? colors.accent : 'transparent',
        marginBottom: 5,
      }}
    />
  );
}

function TabLabel({ focused, color, label }: { focused: boolean; color: string; label: string }) {
  return (
    <Text
      style={{
        fontFamily: focused ? fonts.bodyBold : fonts.bodySemiBold,
        fontSize: 10,
        color,
      }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: '#1C1F24',
          borderTopWidth: 1,
          height: 78,
          paddingTop: 10,
          paddingBottom: 28,
        },
        tabBarItemStyle: { flexDirection: 'column' },
        tabBarIconStyle: { marginBottom: 0 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
          tabBarLabel: ({ focused, color }) => <TabLabel focused={focused} color={color} label="Главная" />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Тренировки',
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
          tabBarLabel: ({ focused, color }) => <TabLabel focused={focused} color={color} label="Тренировки" />,
        }}
      />
      <Tabs.Screen
        name="supplements"
        options={{
          title: 'Добавки',
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
          tabBarLabel: ({ focused, color }) => <TabLabel focused={focused} color={color} label="Добавки" />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'История',
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
          tabBarLabel: ({ focused, color }) => <TabLabel focused={focused} color={color} label="История" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Настройки',
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
          tabBarLabel: ({ focused, color }) => <TabLabel focused={focused} color={color} label="Настройки" />,
        }}
      />
    </Tabs>
  );
}

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { AppText } from './AppText';

/** The Tally DEx mark from TallyDEx_/login/logo.svg: navy disc, orange half. */
export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 3111 2931">
      <G transform="matrix(1.037,0,0,0.977,0,0)">
        <G transform="matrix(0.596864,-0.803922,0.757408,0.633519,-598.778439,1880.367846)">
          <Circle cx={1654} cy={1593} r={972} fill={colors.navy} />
        </G>
        <G transform="matrix(0.596864,-0.803922,0.757408,0.633519,-598.778439,1880.367846)">
          <Path
            d="M682.001,1594C682,1593.667 682,1593.333 682,1593C682,1056.539 1117.539,621 1654,621C2190.461,621 2626,1056.539 2626,1593C2626,1593.333 2626,1593.667 2625.999,1594L682.001,1594Z"
            fill={colors.accent}
          />
        </G>
      </G>
    </Svg>
  );
}

/** "Tally DEx" wordmark: Wix Madefor Display, DEx in accent. */
export function Wordmark({ onDark = false, size = 32 }: { onDark?: boolean; size?: number }) {
  return (
    <View style={styles.row}>
      <AppText
        variant="brand"
        color={onDark ? 'chromeText' : 'text'}
        style={{ fontSize: size, lineHeight: size * 1.2 }}
      >
        Tally{' '}
        <AppText variant="brand" color="accent" style={{ fontSize: size, lineHeight: size * 1.2, fontFamily: fonts.displayBold }}>
          DEx
        </AppText>
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});

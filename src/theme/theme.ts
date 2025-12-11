// src/theme/theme.ts

const colors = {
  primary: '#FF007F',
  secondary: '#4B0082',
  background: '#a1a1e4ff', 
  text: '#333333',
  lightText: '#FFFFFF',
  inactive: '#BDBDBD',
  border: '#E0E0E0',
};


const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: colors.text,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: colors.lightText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 20,
    color: colors.primary,
    fontWeight: '600',
  },
};

export const theme = {
  colors,
  styles,
};
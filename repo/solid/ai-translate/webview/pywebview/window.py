import ctypes

def get_screen_width():
    try:
        user32 = ctypes.windll.user32
        screen_width = user32.GetSystemMetrics(0)
        return screen_width
    except Exception as e:
        print(f"Erro ao obter a largura da tela: {e}")
        return 0


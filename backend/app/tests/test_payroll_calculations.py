from services.payroll import compute_gross_amount, compute_net_amount


def test_gross_amount_for_regular_hours():
    # (600 + 50) / 8 per hour for 40 hours
    assert compute_gross_amount(600, 50, 40, 0) == 3250.0


def test_gross_amount_includes_overtime_and_holiday_premium():
    # 650 for one 8-hour day, 2 overtime hours at 1.25 x 75/hour, plus premium
    assert compute_gross_amount(600, 50, 8, 2, holiday_premium_pay=180) == 1017.5


def test_net_amount_subtracts_all_deductions():
    assert compute_net_amount(3250, phic=75, hdmf=50, sss=100, others=20) == 3005.0


def test_net_amount_never_goes_negative():
    assert compute_net_amount(100, phic=75, hdmf=50, sss=100, others=20) == 0.0
